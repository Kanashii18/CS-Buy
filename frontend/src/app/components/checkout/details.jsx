export default function Details({ product }) {
     return (
          <div className="flex justify-center items-start flex-col bg-white/5 py-4 px-4 gap-[3.2rem] text-[#f3f3f3f5] w-full min-w-0">
               <div className="bg-[rgb(25,23,26)] p-[.4rem] w-full min-w-0">
                    <div className="gap-4 sm:gap-[5rem] py-[.1rem] px-[.4rem] flex bg-[rgb(82,43,117)] items-center justify-around flex-wrap">
                         <div className="min-w-0 max-w-full">
                              <p
                                   className="truncate max-w-[13rem]"
                                   style={{
                                        textOverflow: "ellipsis",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                   }}
                              >
                                   {product.title}
                              </p>
                         </div>

                         <div
                              className="flex flex-col whitespace-nowrap shrink-0"
                              style={{
                                   wordSpacing: "3.6px",
                                   fontFamily: "auto",
                              }}
                         >
                              <h5>Warranty | 7 day</h5>
                              <h5>Delivery | {product.deliveryUnit}</h5>
                         </div>
                    </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-6 w-full min-w-0 justify-between">
                    <div className="w-full min-w-0">
                         <div className="p-[.4rem] w-full min-w-0 flex flex-col h-full justify-between">
                              <div className="text-center py-[.4rem] px-4 w-full flex flex-col gap-6">
                                   <div className="flex justify-around gap-4 flex-wrap">
                                        <h4 className="whitespace-nowrap text-[#f3f3f3f5]">
                                             Order Price:
                                        </h4>

                                        <h4 className="whitespace-nowrap text-[#f3f3f3f5]">
                                             {product.price} $
                                        </h4>
                                   </div>
                              </div>

                              <div className="flex justify-around text-[1.09rem] gap-4">
                                   <h3>Total:</h3>
                                   <h3>{product.price} $</h3>
                              </div>
                         </div>
                    </div>

                    <div className="flex flex-col justify-center items-center gap-[3.1rem] shrink-0">
                         <div className="w-[11rem] h-[11rem] overflow-hidden p-[.3rem] bg-[rgb(43,58,58)]">
                              <img
                                   src={product.image}
                                   alt="product image"
                                   className="w-full h-full object-cover block"
                              />
                         </div>
                    </div>
               </div>
          </div>
     );
}
